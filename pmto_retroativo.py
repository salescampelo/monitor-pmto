"""
=================================================================
COLETA RETROATIVA — CEL. MÁRCIO BARBOSA / PMTO
=================================================================
Coleta menções históricas (ago/2022 — presente) usando:
  1. Google Search com filtro de data (principal)
  2. Busca interna paginada nos portais do Tocantins
  3. Limpeza automática de menções do site oficial da PMTO

Uso:
    python pmto_retroativo.py

O resultado é salvo em data/mention_history.json,
acumulando com os dados do monitor diário.

Autor: Marcel Sales Campelo
Versão: 1.0
=================================================================
"""

import os
import re
import json
import hashlib
import logging
import time
from datetime import datetime, timedelta
from pathlib import Path
from dataclasses import dataclass, field, asdict
from typing import Optional
from urllib.parse import urljoin, quote_plus, urlencode

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

load_dotenv()

# ─────────────────────────────────────────────
# CONFIGURAÇÃO
# ─────────────────────────────────────────────

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

HISTORY_FILE = DATA_DIR / "mention_history.json"
SEEN_FILE = DATA_DIR / "seen_articles.json"
LOG_FILE = DATA_DIR / "retroativo.log"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
    "Accept": "text/html,application/xhtml+xml",
}

TIMEOUT = 20
DELAY_BETWEEN_REQUESTS = 3  # segundos entre requests (evita bloqueio)


# ─────────────────────────────────────────────
# TERMOS DE BUSCA
# ─────────────────────────────────────────────

GOOGLE_QUERIES = [
    # Menções diretas (nome + variações)
    '"Coronel Márcio Barbosa" Tocantins',
    '"Márcio Barbosa" PMTO',
    '"Márcio Antônio Barbosa de Mendonça"',
    '"Coronel Barbosa" "Polícia Militar" Tocantins',
    '"Cel Barbosa" PMTO comandante',
    # Menções institucionais relevantes
    '"comandante-geral" PMTO "Barbosa"',
    'PMTO "Coronel Barbosa" operação',
    'PMTO "Coronel Barbosa" segurança',
]

# Domínios a EXCLUIR dos resultados (PMTO oficial + Gov)
BLOCKED_DOMAINS = [
    "to.gov.br",
    "pm.to.gov.br",
    "gov.br/pm",
    "diariooficial.to.gov.br",
    "doe.to.gov.br",
]

# ─────────────────────────────────────────────
# PORTAIS COM BUSCA INTERNA (scraping paginado)
# ─────────────────────────────────────────────

PORTAL_SEARCHES = [
    {
        "name": "Conexão Tocantins",
        "scope": "TO",
        "source_type": "Portal",
        "priority": "media",
        # Conexão TO usa WordPress, busca via ?s=
        "url_template": "https://conexaoto.com.br/?s={query}&paged={page}",
        "queries": ["Coronel Barbosa", "Márcio Barbosa PMTO"],
        "max_pages": 10,
    },
    {
        "name": "Atitude Tocantins",
        "scope": "TO",
        "source_type": "Portal",
        "priority": "alta",
        "url_template": "https://atitudeto.com.br/?s={query}&paged={page}",
        "queries": ["Coronel Barbosa", "Márcio Barbosa"],
        "max_pages": 10,
    },
    {
        "name": "AF Notícias",
        "scope": "TO",
        "source_type": "Portal",
        "priority": "alta",
        "url_template": "https://afnoticias.com.br/?s={query}&paged={page}",
        "queries": ["Coronel Barbosa", "Márcio Barbosa", "PMTO"],
        "max_pages": 10,
    },
    {
        "name": "Sou de Palmas",
        "scope": "TO",
        "source_type": "Portal",
        "priority": "media",
        "url_template": "https://soudepalmas.com.br/?s={query}&paged={page}",
        "queries": ["Coronel Barbosa", "Márcio Barbosa"],
        "max_pages": 10,
    },
    {
        "name": "Gazeta do Cerrado",
        "scope": "TO",
        "source_type": "Portal",
        "priority": "alta",
        "url_template": "https://gazetadocerrado.com.br/?s={query}&paged={page}",
        "queries": ["Coronel Barbosa", "Márcio Barbosa"],
        "max_pages": 10,
    },
    {
        "name": "Cleber Toledo",
        "scope": "TO",
        "source_type": "Blog",
        "priority": "alta",
        "url_template": "https://clebertoledo.com.br/?s={query}&paged={page}",
        "queries": ["Coronel Barbosa", "Márcio Barbosa", "comandante PMTO"],
        "max_pages": 10,
    },
    {
        "name": "Foco Tocantins",
        "scope": "TO",
        "source_type": "Portal",
        "priority": "media",
        "url_template": "https://focotocantins.com.br/?s={query}&paged={page}",
        "queries": ["Coronel Barbosa", "Márcio Barbosa"],
        "max_pages": 5,
    },
    {
        "name": "O Girassol",
        "scope": "TO",
        "source_type": "Portal",
        "priority": "media",
        "url_template": "https://ogirassol.com.br/?s={query}&paged={page}",
        "queries": ["Coronel Barbosa", "Márcio Barbosa"],
        "max_pages": 5,
    },
    {
        "name": "Portal LJ",
        "scope": "TO",
        "source_type": "Portal",
        "priority": "media",
        "url_template": "https://lealjunior.com.br/?s={query}&paged={page}",
        "queries": ["Coronel Barbosa", "PMTO Barbosa"],
        "max_pages": 5,
    },
]


# ─────────────────────────────────────────────
# MODELO DE DADOS (compatível com pmto_monitor.py)
# ─────────────────────────────────────────────

@dataclass
class Article:
    title: str
    url: str
    source_name: str
    source_type: str
    priority: str
    scope: str = "BR"
    matched_terms: list = field(default_factory=list)
    mention_type: str = "direta"
    detected_at: str = ""
    snippet: str = ""
    hash_id: str = ""

    def __post_init__(self):
        if not self.detected_at:
            self.detected_at = datetime.now().strftime("%Y-%m-%d %H:%M")
        if not self.hash_id:
            self.hash_id = hashlib.md5(
                (self.title + self.url).encode()
            ).hexdigest()[:12]


# ─────────────────────────────────────────────
# FUNÇÕES AUXILIARES
# ─────────────────────────────────────────────

def is_blocked_url(url: str) -> bool:
    """Verifica se a URL pertence a um domínio bloqueado."""
    url_lower = url.lower()
    return any(domain in url_lower for domain in BLOCKED_DOMAINS)


def fetch_page(url: str) -> Optional[BeautifulSoup]:
    try:
        resp = requests.get(url, headers=HEADERS, timeout=TIMEOUT, allow_redirects=True)
        resp.raise_for_status()
        resp.encoding = resp.apparent_encoding or "utf-8"
        return BeautifulSoup(resp.text, "lxml")
    except Exception as e:
        logger.warning(f"  Erro: {e}")
        return None


def classify_mention(title: str, url: str) -> str:
    """Classifica o tipo de menção baseado no título."""
    text = title.lower()
    direct_terms = ["barbosa", "márcio", "marcio", "cel.", "coronel barbosa",
                    "comandante-geral", "comandante geral", "mendonça", "mendonca"]
    if any(t in text for t in direct_terms):
        return "direta"
    return "institucional"


def extract_matched_terms(title: str) -> list:
    """Extrai termos relevantes encontrados no título."""
    text = title.lower()
    all_terms = [
        "coronel barbosa", "márcio barbosa", "marcio barbosa", "barbosa de mendonça",
        "comandante-geral", "comandante geral", "pmto", "polícia militar",
        "pré-candidato", "deputado", "eleição", "letalidade", "intervenção",
        "operação", "promoção", "concurso", "denúncia"
    ]
    return [t for t in all_terms if t in text]


# ─────────────────────────────────────────────
# COLETA VIA GOOGLE SEARCH (por período)
# ─────────────────────────────────────────────

def google_search_period(query: str, date_from: str, date_to: str, num_results: int = 50) -> list[dict]:
    """
    Faz busca no Google com filtro de data.
    date_from/date_to no formato MM/DD/YYYY.
    Retorna lista de {title, url, snippet}.
    """
    results = []
    seen_urls = set()

    # Google usa tbs=cdr:1,cd_min:MM/DD/YYYY,cd_max:MM/DD/YYYY
    tbs = f"cdr:1,cd_min:{date_from},cd_max:{date_to}"

    for start in range(0, num_results, 10):
        params = {
            "q": query,
            "tbs": tbs,
            "start": start,
            "num": 10,
            "hl": "pt-BR",
            "gl": "BR",
        }
        url = f"https://www.google.com/search?{urlencode(params)}"

        logger.info(f"  Google [{start+1}-{start+10}]: {query[:50]}...")
        time.sleep(DELAY_BETWEEN_REQUESTS)

        soup = fetch_page(url)
        if not soup:
            break

        # Extrai resultados orgânicos
        for div in soup.select("div.g, div[data-sokoban-container]"):
            link_tag = div.select_one("a[href]")
            title_tag = div.select_one("h3")

            if not link_tag or not title_tag:
                continue

            href = link_tag.get("href", "")
            title = title_tag.get_text(strip=True)

            if not href.startswith("http") or not title:
                continue
            if href in seen_urls:
                continue
            if is_blocked_url(href):
                continue

            seen_urls.add(href)

            # Snippet (trecho da matéria)
            snippet_tag = div.select_one("div[data-sncf], span.st, div.VwiC3b")
            snippet = snippet_tag.get_text(strip=True) if snippet_tag else ""

            results.append({
                "title": title,
                "url": href,
                "snippet": snippet,
            })

        # Se conseguiu menos de 10, não há mais páginas
        page_results = len([d for d in soup.select("div.g, div[data-sokoban-container]") if d.select_one("h3")])
        if page_results < 5:
            break

    return results


def collect_google_retroactive() -> list[Article]:
    """Coleta retroativa via Google Search em blocos de 6 meses."""
    logger.info("=" * 50)
    logger.info("COLETA RETROATIVA — Google Search")
    logger.info("=" * 50)

    articles = []
    seen_hashes = set()

    # Divide o período ago/2022 — hoje em blocos de 6 meses
    periods = []
    start = datetime(2022, 8, 1)
    now = datetime.now()

    while start < now:
        end = min(start + timedelta(days=180), now)
        periods.append((
            start.strftime("%m/%d/%Y"),
            end.strftime("%m/%d/%Y"),
            f"{start.strftime('%b/%Y')}–{end.strftime('%b/%Y')}"
        ))
        start = end + timedelta(days=1)

    for query in GOOGLE_QUERIES:
        for date_from, date_to, period_label in periods:
            logger.info(f"\nBuscando: \"{query}\" [{period_label}]")

            results = google_search_period(query, date_from, date_to, num_results=30)
            logger.info(f"  → {len(results)} resultados")

            for r in results:
                if is_blocked_url(r["url"]):
                    continue

                h = hashlib.md5((r["title"] + r["url"]).encode()).hexdigest()[:12]
                if h in seen_hashes:
                    continue
                seen_hashes.add(h)

                mention_type = classify_mention(r["title"], r["url"])
                terms = extract_matched_terms(r["title"])

                # Detecta scope pelo domínio
                scope = "TO"
                national_domains = ["g1.globo", "uol.com", "metropoles", "r7.com",
                                     "terra.com", "poder360", "congressoemfoco",
                                     "brasildefato", "bmcnews", "noticias-do-brasil"]
                if any(d in r["url"].lower() for d in national_domains):
                    scope = "BR"

                article = Article(
                    title=r["title"],
                    url=r["url"],
                    source_name=extract_source_name(r["url"]),
                    source_type="Portal",
                    priority="alta" if mention_type == "direta" else "media",
                    scope=scope,
                    matched_terms=terms,
                    mention_type=mention_type,
                    snippet=r.get("snippet", ""),
                    hash_id=h,
                )
                articles.append(article)

    logger.info(f"\n✅ Google: {len(articles)} menções únicas coletadas")
    return articles


def extract_source_name(url: str) -> str:
    """Extrai nome legível do domínio."""
    from urllib.parse import urlparse
    domain = urlparse(url).netloc.lower()
    domain = domain.replace("www.", "")

    name_map = {
        "conexaoto.com.br": "Conexão Tocantins",
        "atitudeto.com.br": "Atitude Tocantins",
        "afnoticias.com.br": "AF Notícias",
        "soudepalmas.com.br": "Sou de Palmas",
        "gazetadocerrado.com.br": "Gazeta do Cerrado",
        "clebertoledo.com.br": "Cleber Toledo",
        "t1noticias.com.br": "T1 Notícias",
        "focotocantins.com.br": "Foco Tocantins",
        "ogirassol.com.br": "O Girassol",
        "lealjunior.com.br": "Portal LJ",
        "jornaldotocantins.com.br": "Jornal do Tocantins",
        "luizarmandocosta.com.br": "Luiz Armando Costa",
        "otocantins.com.br": "Portal O Tocantins",
        "tocantinsagora.com.br": "Tocantins Agora",
        "g1.globo.com": "G1",
        "noticias.uol.com.br": "UOL",
        "metropoles.com": "Metrópoles",
        "noticias.r7.com": "R7",
        "poder360.com.br": "Poder360",
        "al.to.leg.br": "Assembleia Legislativa TO",
        "portaljaciarabarros.com.br": "Portal Jaciara Barros",
        "agenciatocantins.com.br": "Agência Tocantins",
    }

    for key, name in name_map.items():
        if key in domain:
            return name

    # Fallback: usa o domínio limpo
    parts = domain.split(".")
    return parts[0].replace("-", " ").title()


# ─────────────────────────────────────────────
# COLETA VIA BUSCA INTERNA DOS PORTAIS
# ─────────────────────────────────────────────

def collect_portal_search(portal: dict) -> list[Article]:
    """Faz scraping paginado na busca interna de um portal."""
    articles = []
    seen_urls = set()

    for query in portal["queries"]:
        for page in range(1, portal["max_pages"] + 1):
            url = portal["url_template"].format(
                query=quote_plus(query),
                page=page
            )

            logger.info(f"  [{portal['name']}] p.{page}: {query}")
            time.sleep(DELAY_BETWEEN_REQUESTS)

            soup = fetch_page(url)
            if not soup:
                break

            # Extrai links de artigos (seletores WordPress genéricos)
            found = 0
            for a_tag in soup.select("article a, h2 a, h3 a, .entry-title a, .post-title a"):
                href = a_tag.get("href", "").strip()
                title = a_tag.get_text(strip=True)

                if not href or not title or len(title) < 15:
                    continue
                if href.startswith("/"):
                    href = urljoin(portal["url_template"].split("?")[0], href)
                if not href.startswith("http"):
                    continue
                if href in seen_urls:
                    continue
                if is_blocked_url(href):
                    continue

                seen_urls.add(href)
                found += 1

                mention_type = classify_mention(title, href)
                terms = extract_matched_terms(title)

                h = hashlib.md5((title + href).encode()).hexdigest()[:12]

                article = Article(
                    title=title,
                    url=href,
                    source_name=portal["name"],
                    source_type=portal["source_type"],
                    priority=portal["priority"],
                    scope=portal["scope"],
                    matched_terms=terms,
                    mention_type=mention_type,
                    hash_id=h,
                )
                articles.append(article)

            # Se não encontrou nada nesta página, acabaram os resultados
            if found == 0:
                break

    return articles


def collect_all_portals() -> list[Article]:
    """Coleta retroativa em todos os portais com busca interna."""
    logger.info("=" * 50)
    logger.info("COLETA RETROATIVA — Busca Interna dos Portais")
    logger.info("=" * 50)

    all_articles = []
    for portal in PORTAL_SEARCHES:
        logger.info(f"\n▶ {portal['name']}")
        articles = collect_portal_search(portal)
        logger.info(f"  → {len(articles)} artigos coletados")
        all_articles.extend(articles)

    logger.info(f"\n✅ Portais: {len(all_articles)} menções coletadas")
    return all_articles


# ─────────────────────────────────────────────
# LIMPEZA DO HISTÓRICO (remove PMTO oficial)
# ─────────────────────────────────────────────

def clean_history():
    """Remove menções de domínios bloqueados do histórico existente."""
    if not HISTORY_FILE.exists():
        logger.info("Nenhum histórico para limpar.")
        return 0

    history = json.loads(HISTORY_FILE.read_text(encoding="utf-8"))
    original_count = len(history)

    cleaned = [
        a for a in history
        if not is_blocked_url(a.get("url", ""))
    ]

    removed = original_count - len(cleaned)

    if removed > 0:
        HISTORY_FILE.write_text(
            json.dumps(cleaned, ensure_ascii=False, indent=2),
            encoding="utf-8"
        )
        logger.info(f"🧹 Removidas {removed} menções de domínios bloqueados (to.gov.br, etc.)")
    else:
        logger.info("Histórico limpo — nenhuma menção de domínio bloqueado encontrada.")

    return removed


def clean_seen():
    """Limpa o controle de artigos vistos para permitir recoleta."""
    if SEEN_FILE.exists():
        SEEN_FILE.unlink()
        logger.info("🧹 Arquivo seen_articles.json resetado.")


# ─────────────────────────────────────────────
# MERGE COM HISTÓRICO EXISTENTE
# ─────────────────────────────────────────────

def merge_to_history(new_articles: list[Article]):
    """Adiciona artigos ao histórico sem duplicar."""
    history = []
    if HISTORY_FILE.exists():
        try:
            history = json.loads(HISTORY_FILE.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, TypeError):
            history = []

    existing_hashes = {a.get("hash_id", "") for a in history}
    added = 0

    for article in new_articles:
        a_dict = asdict(article)
        if a_dict["hash_id"] not in existing_hashes:
            history.append(a_dict)
            existing_hashes.add(a_dict["hash_id"])
            added += 1

    HISTORY_FILE.write_text(
        json.dumps(history, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

    logger.info(f"💾 {added} novas menções adicionadas ao histórico (total: {len(history)})")
    return added


# ─────────────────────────────────────────────
# EXECUÇÃO PRINCIPAL
# ─────────────────────────────────────────────

def main():
    logger.info("╔══════════════════════════════════════════════╗")
    logger.info("║  COLETA RETROATIVA — Cel. Márcio Barbosa     ║")
    logger.info("║  Período: Ago/2022 — Presente                ║")
    logger.info("╚══════════════════════════════════════════════╝")

    # PASSO 1: Limpa menções da PMTO oficial do histórico existente
    logger.info("\n📋 PASSO 1: Limpando menções de domínios bloqueados...")
    clean_history()

    # PASSO 2: Coleta via busca interna dos portais TO
    logger.info("\n📋 PASSO 2: Coleta via busca interna dos portais...")
    portal_articles = collect_all_portals()

    # PASSO 3: Coleta via Google Search por período
    logger.info("\n📋 PASSO 3: Coleta via Google Search (ago/2022 — hoje)...")
    google_articles = collect_google_retroactive()

    # PASSO 4: Merge tudo no histórico
    all_new = portal_articles + google_articles

    # Remove duplicatas internas
    seen = set()
    unique = []
    for a in all_new:
        if a.hash_id not in seen:
            seen.add(a.hash_id)
            unique.append(a)

    logger.info(f"\n📊 Total coletado: {len(unique)} menções únicas")
    logger.info(f"   Portais: {len(portal_articles)} | Google: {len(google_articles)}")

    # PASSO 5: Salva no histórico
    logger.info("\n📋 PASSO 5: Salvando no histórico...")
    merge_to_history(unique)

    # PASSO 6: Reset do seen_articles para que o monitor diário
    # não ignore artigos históricos na próxima execução
    clean_seen()

    logger.info("\n" + "=" * 50)
    logger.info("✅ COLETA RETROATIVA CONCLUÍDA")
    logger.info("=" * 50)
    logger.info(f"Arquivo: {HISTORY_FILE}")
    logger.info("Próximo passo: carregue o mention_history.json no dashboard.")


if __name__ == "__main__":
    main()
