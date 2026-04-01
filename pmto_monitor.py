"""
=================================================================
MONITOR DE MENÇÕES — CEL. MÁRCIO BARBOSA / PMTO
=================================================================
Script de monitoramento automatizado de imprensa do Tocantins.
Varre 20 fontes, detecta menções e envia alertas via e-mail.

Autor: Marcel Sales Campelo
Versão: 1.1
Python: 3.9+
=================================================================

INSTALAÇÃO:
    pip install requests beautifulsoup4 lxml python-dotenv

CONFIGURAÇÃO:
    1. Crie um arquivo .env na mesma pasta (veja modelo abaixo)
    2. Gere uma Senha de App no Google (instruções no .env)
    3. Agende a execução 2x/dia (instruções no final do arquivo)

ARQUIVO .env (modelo):
    GMAIL_ADDRESS=marcelsalescampelo@gmail.com
    GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
    NOTIFY_TO=marcelsalescampelo@gmail.com
=================================================================
"""

import os
import re
import json
import hashlib
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from pathlib import Path
from dataclasses import dataclass, field, asdict
from typing import Optional
from urllib.parse import urljoin
 
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
 
# ─────────────────────────────────────────────
# CONFIGURAÇÃO
# ─────────────────────────────────────────────
 
load_dotenv()
 
# Diretório base do projeto
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)
 
# Arquivos de controle
SEEN_FILE = DATA_DIR / "seen_articles.json"
HISTORY_FILE = DATA_DIR / "mention_history.json"
LOG_FILE = DATA_DIR / "monitor.log"
 
# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)
 
# Headers para requests
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
}
 
REQUEST_TIMEOUT = 15  # segundos
 
 
# ─────────────────────────────────────────────
# TERMOS DE BUSCA
# ─────────────────────────────────────────────
 
# Termos para menções diretas ao Cel. Barbosa (nome completo e variações)
TERMS_DIRECT = [
    "coronel barbosa",
    "márcio barbosa",
    "marcio barbosa",
    "cel. barbosa",
    "cel barbosa",
    "márcio antônio barbosa",
    "marcio antonio barbosa",
    "barbosa de mendonça",
    "barbosa de mendonca",
    "márcio mendonça",
    "marcio mendonca",
    "comandante-geral da pm",
    "comandante geral da pm",
    "comandante da pm do tocantins",
    "comandante da pmto",
    "ex-comandante da pmto",
    "ex-comandante da pm",
]
 
# Termos para menções à PMTO como instituição
TERMS_INSTITUTIONAL = [
    "pmto",
    "polícia militar do tocantins",
    "policia militar do tocantins",
    "comando da pm tocantins",
    "pm do tocantins",
    "pm-to",
    "polícia militar tocantins",
    "policiamento tocantins",
]
 
# Termos de crise (amplificam urgência quando combinados)
TERMS_CRISIS = [
    "letalidade policial",
    "intervenção policial",
    "promoção pm",
    "promoções pm",
    "gabinete do ódio",
    "abuso policial",
    "violência policial",
    "denúncia pm",
    "irregularidade pm",
    "mpe",  # Ministério Público Estadual
    "tce",  # Tribunal de Contas
]
 
# Termos eleitorais (novo contexto: pré-candidatura 2026)
TERMS_ELECTORAL = [
    "pré-candidato",
    "pre-candidato",
    "candidato a deputado",
    "candidatura federal",
    "desincompatibilização",
    "eleições 2026",
    "deputado federal tocantins",
]
 
 
# ─────────────────────────────────────────────
# FONTES DE MONITORAMENTO
# Tocantins (18) + Nacionais (14) = 32 fontes
# Excluídos: PMTO Oficial e Gov do Tocantins
# ─────────────────────────────────────────────
 
@dataclass
class Source:
    """Representa uma fonte de notícias a ser monitorada."""
    name: str
    url: str
    source_type: str  # Blog, Portal, Jornal, Agência, TV/Portal
    priority: str     # alta, media, complementar
    scope: str = "TO" # TO = Tocantins, BR = Nacional
    section: str = "" # Seção específica do site
 
    @property
    def full_url(self) -> str:
        return self.url + self.section
 
 
SOURCES = [
    # ══════════════════════════════════════════
    # TOCANTINS — IMPRENSA LOCAL (18 fontes)
    # ══════════════════════════════════════════
 
    # ── PRIORIDADE ALTA (cobertura policial/política frequente) ──
    Source("Luiz Armando Costa", "https://www.luizarmandocosta.com.br", "Blog", "alta", "TO"),
    Source("T1 Notícias", "https://t1noticias.com.br", "Portal", "alta", "TO", "/estado/"),
    Source("Cleber Toledo", "https://clebertoledo.com.br", "Blog", "alta", "TO", "/categoria/tocantins/"),
    Source("AF Notícias", "https://afnoticias.com.br", "Portal", "alta", "TO"),
    Source("Atitude Tocantins", "https://atitudeto.com.br", "Portal", "alta", "TO"),
    Source("Jornal do Tocantins", "https://www.jornaldotocantins.com.br", "Jornal", "alta", "TO"),
    Source("Gazeta do Cerrado", "https://gazetadocerrado.com.br", "Portal", "alta", "TO"),
 
    # ── PRIORIDADE MÉDIA (portais gerais com editoria policial) ──
    Source("Conexão Tocantins", "https://conexaoto.com.br", "Portal", "media", "TO"),
    Source("Agência Tocantins", "https://www.agenciatocantins.com.br", "Agência", "media", "TO", "/policia"),
    Source("Sou de Palmas", "https://soudepalmas.com.br", "Portal", "media", "TO"),
    Source("Portal O Tocantins", "https://otocantins.com.br", "Portal", "media", "TO"),
    Source("Foco Tocantins", "https://focotocantins.com.br", "Portal", "media", "TO"),
    Source("Jornal Tocantins News", "https://jornaltocantinsnews.com.br", "Portal", "media", "TO"),
    Source("Notícia Tocantins", "https://noticiatocantins.com.br", "Portal", "media", "TO"),
    Source("Portal LJ (Leal Júnior)", "https://lealjunior.com.br", "Portal", "media", "TO"),
    Source("O Girassol", "https://ogirassol.com.br", "Portal", "media", "TO"),
 
    # ── COMPLEMENTARES (regionais do interior) ──
    Source("Tocantins Agora", "https://www.tocantinsagora.com.br", "Portal", "complementar", "TO"),
    Source("Portal Norte (SBT)", "https://portalnorte.com.br", "TV/Portal", "complementar", "TO", "/regiao/tocantins/"),
 
    # ══════════════════════════════════════════
    # BRASIL — IMPRENSA NACIONAL (14 fontes)
    # Portais que cobrem segurança pública,
    # política estadual e eleições 2026
    # ══════════════════════════════════════════
 
    # ── GRANDES PORTAIS NACIONAIS ──
    Source("G1 Tocantins", "https://g1.globo.com/to/tocantins/", "Portal", "alta", "BR"),
    Source("UOL Notícias", "https://noticias.uol.com.br/ultimas/", "Portal", "media", "BR"),
    Source("Metrópoles", "https://www.metropoles.com/brasil", "Portal", "media", "BR"),
    Source("R7 Notícias", "https://noticias.r7.com/brasil", "Portal", "media", "BR"),
    Source("Terra Notícias", "https://www.terra.com.br/noticias/", "Portal", "media", "BR"),
 
    # ── POLÍTICA E SEGURANÇA PÚBLICA ──
    Source("Poder360", "https://www.poder360.com.br/governo/", "Portal", "media", "BR"),
    Source("Congresso em Foco", "https://congressoemfoco.uol.com.br/area/pais/", "Portal", "media", "BR"),
    Source("Brasil de Fato", "https://www.brasildefato.com.br/", "Portal", "complementar", "BR"),
 
    # ── SEGURANÇA PÚBLICA ESPECIALIZADO ──
    Source("Fórum Brasileiro SP", "https://forumseguranca.org.br/publicacoes/", "Especializado", "complementar", "BR"),
 
    # ── AGREGADORES E FACT-CHECK ──
    Source("Google News Brasil", "https://news.google.com/search?q=%22coronel+barbosa%22+tocantins&hl=pt-BR&gl=BR&ceid=BR:pt-419", "Agregador", "alta", "BR"),
    Source("Google News PMTO", "https://news.google.com/search?q=PMTO+%22pol%C3%ADcia+militar+tocantins%22&hl=pt-BR&gl=BR&ceid=BR:pt-419", "Agregador", "media", "BR"),
 
    # ── IMPRENSA REGIONAL NORTE/CENTRO-OESTE ──
    Source("Meio Norte", "https://meionorte.com/noticias/policia", "Portal", "complementar", "BR"),
    Source("Jornal Opção (GO)", "https://www.jornalopcao.com.br", "Jornal", "complementar", "BR"),
    Source("Assembleia Legislativa TO", "https://al.to.leg.br/noticias", "Institucional", "complementar", "BR"),
]
 
 
# ─────────────────────────────────────────────
# MODELOS DE DADOS
# ─────────────────────────────────────────────
 
@dataclass
class Article:
    """Artigo detectado em uma fonte."""
    title: str
    url: str
    source_name: str
    source_type: str
    priority: str
    scope: str = "TO"                    # TO = local, BR = nacional
    matched_terms: list = field(default_factory=list)
    mention_type: str = ""               # "direta", "institucional", "eleitoral"
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
# FUNÇÕES DE SCRAPING
# ─────────────────────────────────────────────
 
def fetch_page(url: str) -> Optional[BeautifulSoup]:
    """Faz o download de uma página e retorna o objeto BeautifulSoup."""
    try:
        response = requests.get(
            url, headers=HEADERS, timeout=REQUEST_TIMEOUT, 
            allow_redirects=True, verify=True
        )
        response.raise_for_status()
        response.encoding = response.apparent_encoding or "utf-8"
        return BeautifulSoup(response.text, "lxml")
    except requests.exceptions.RequestException as e:
        logger.warning(f"Erro ao acessar {url}: {e}")
        return None
 
 
def extract_articles(soup: BeautifulSoup, source: Source) -> list[dict]:
    """
    Extrai artigos de uma página.
    Estratégia genérica: busca tags <a> dentro de containers comuns
    de notícias (article, h1-h4, .post-title, etc.).
    """
    articles = []
    seen_urls = set()
 
    # Seletores comuns em portais de notícias brasileiros
    selectors = [
        "article a",
        "h1 a", "h2 a", "h3 a", "h4 a",
        ".post-title a",
        ".entry-title a",
        ".titulo a",
        ".news-title a",
        ".td-module-title a",
        ".jeg_post_title a",
        "a.gs-title",
    ]
 
    for selector in selectors:
        for link in soup.select(selector):
            href = link.get("href", "").strip()
            title = link.get_text(strip=True)
 
            if not href or not title or len(title) < 15:
                continue
 
            # Normaliza URL
            if href.startswith("/"):
                href = urljoin(source.url, href)
            elif not href.startswith("http"):
                continue
 
            # Deduplica
            if href in seen_urls:
                continue
            seen_urls.add(href)
 
            articles.append({
                "title": title,
                "url": href,
            })
 
    # Fallback: se nenhum seletor específico funcionou,
    # pega todos os <a> com texto significativo
    if not articles:
        for link in soup.find_all("a", href=True):
            title = link.get_text(strip=True)
            href = link["href"].strip()
 
            if not title or len(title) < 20:
                continue
            if href.startswith("/"):
                href = urljoin(source.url, href)
            elif not href.startswith("http"):
                continue
            if href in seen_urls:
                continue
 
            seen_urls.add(href)
            articles.append({"title": title, "url": href})
 
    return articles
 
 
def check_mentions(title: str, snippet: str = "") -> dict:
    """
    Verifica se um título/snippet contém menções relevantes.
    Retorna dict com tipo de menção e termos encontrados.
    """
    text = (title + " " + snippet).lower()
    result = {
        "is_match": False,
        "mention_type": "",
        "matched_terms": [],
        "has_crisis_term": False,
        "crisis_terms": [],
        "has_electoral_term": False,
        "electoral_terms": [],
    }
 
    # Checa menções diretas (prioridade máxima)
    for term in TERMS_DIRECT:
        if term.lower() in text:
            result["is_match"] = True
            result["mention_type"] = "direta"
            result["matched_terms"].append(term)
 
    # Checa menções institucionais
    for term in TERMS_INSTITUTIONAL:
        if term.lower() in text:
            result["is_match"] = True
            if not result["mention_type"]:
                result["mention_type"] = "institucional"
            result["matched_terms"].append(term)
 
    # Checa termos de crise (amplificador)
    for term in TERMS_CRISIS:
        if term.lower() in text:
            result["has_crisis_term"] = True
            result["crisis_terms"].append(term)
 
    # Checa termos eleitorais (novo contexto 2026)
    for term in TERMS_ELECTORAL:
        if term.lower() in text:
            result["has_electoral_term"] = True
            result["electoral_terms"].append(term)
            # Se já é menção direta + eleitoral, reclassifica
            if result["mention_type"] == "direta":
                result["mention_type"] = "direta"  # mantém direta (mais grave)
            elif not result["mention_type"]:
                result["is_match"] = True
                result["mention_type"] = "eleitoral"
 
    # Deduplica
    result["matched_terms"] = list(set(result["matched_terms"]))
    result["crisis_terms"] = list(set(result["crisis_terms"]))
    result["electoral_terms"] = list(set(result["electoral_terms"]))
 
    return result
 
 
# ─────────────────────────────────────────────
# CONTROLE DE ARTIGOS JÁ VISTOS
# ─────────────────────────────────────────────
 
def load_seen() -> set:
    """Carrega hashes de artigos já notificados."""
    if SEEN_FILE.exists():
        try:
            data = json.loads(SEEN_FILE.read_text(encoding="utf-8"))
            return set(data)
        except (json.JSONDecodeError, TypeError):
            return set()
    return set()
 
 
def save_seen(seen: set):
    """Salva hashes de artigos já notificados."""
    # Mantém apenas os últimos 30 dias (limpa hashes antigos)
    SEEN_FILE.write_text(
        json.dumps(list(seen)[-5000:], ensure_ascii=False),
        encoding="utf-8"
    )
 
 
def save_to_history(articles: list[Article]):
    """Salva artigos detectados no histórico JSON (para o dashboard)."""
    history = []
    if HISTORY_FILE.exists():
        try:
            history = json.loads(HISTORY_FILE.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, TypeError):
            history = []
 
    for article in articles:
        history.append(asdict(article))
 
    HISTORY_FILE.write_text(
        json.dumps(history, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )
 
 
# ─────────────────────────────────────────────
# NOTIFICAÇÕES POR E-MAIL (Gmail)
# ─────────────────────────────────────────────
 
GMAIL_ADDRESS = os.getenv("GMAIL_ADDRESS", "marcelsalescampelo@gmail.com")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "")
NOTIFY_TO = os.getenv("NOTIFY_TO", "marcelsalescampelo@gmail.com")
 
 
def build_email_html(articles: list[Article]) -> str:
    """Gera o corpo do e-mail em HTML formatado."""
    now = datetime.now().strftime("%d/%m/%Y %H:%M")
 
    diretas = [a for a in articles if a.mention_type == "direta"]
    institucionais = [a for a in articles if a.mention_type == "institucional"]
    eleitorais = [a for a in articles if a.mention_type == "eleitoral"]
    nacionais = [a for a in articles if a.scope == "BR"]
 
    html = f"""
    <html>
    <body style="font-family: -apple-system, 'Segoe UI', Arial, sans-serif;
                 color: #1a1a2e; max-width: 640px; margin: 0 auto;
                 padding: 20px; background: #f8f9fa;">
 
    <div style="background: #ffffff; border-radius: 12px; padding: 28px;
                border: 1px solid #e2e8f0;">
 
        <div style="border-bottom: 2px solid #ef4444; padding-bottom: 16px;
                    margin-bottom: 24px;">
            <h1 style="margin: 0; font-size: 20px; color: #0f172a;">
                🔔 Alerta de Menções — PMTO
            </h1>
            <p style="margin: 6px 0 0; font-size: 13px; color: #64748b;">
                {now} · {len(articles)} nova(s) menção(ões) detectada(s)
            </p>
        </div>
    """
 
    if diretas:
        html += f"""
        <div style="margin-bottom: 24px;">
            <h2 style="font-size: 14px; color: #ef4444; text-transform: uppercase;
                       letter-spacing: 0.05em; margin: 0 0 12px;">
                🔴 Menções diretas — Cel. Barbosa ({len(diretas)})
            </h2>
        """
        for a in diretas:
            crisis_badge = ""
            crisis_terms_found = [t for t in a.matched_terms if t in TERMS_CRISIS]
            if crisis_terms_found:
                crisis_badge = (
                    '<span style="display: inline-block; background: #fef2f2; '
                    'color: #dc2626; font-size: 10px; font-weight: 700; '
                    'padding: 2px 8px; border-radius: 4px; margin-left: 6px;">'
                    '⚠ CRISE</span>'
                )
            html += f"""
            <div style="padding: 14px; background: #fef2f2; border-radius: 8px;
                        border-left: 3px solid #ef4444; margin-bottom: 10px;">
                <p style="margin: 0 0 4px; font-size: 10px; color: #94a3b8;
                          text-transform: uppercase; font-weight: 700;">
                    {a.source_name} · {a.source_type} · Prioridade {a.priority}
                </p>
                <p style="margin: 0 0 6px; font-size: 15px; font-weight: 600;
                          color: #0f172a;">
                    {a.title}{crisis_badge}
                </p>
                <p style="margin: 0; font-size: 12px; color: #64748b;">
                    Termos: {', '.join(a.matched_terms)}
                </p>
                <a href="{a.url}" style="display: inline-block; margin-top: 8px;
                   font-size: 12px; color: #3b82f6; text-decoration: none;
                   font-weight: 600;">
                    Abrir matéria →
                </a>
            </div>
            """
        html += "</div>"
 
    if institucionais:
        html += f"""
        <div style="margin-bottom: 24px;">
            <h2 style="font-size: 14px; color: #f59e0b; text-transform: uppercase;
                       letter-spacing: 0.05em; margin: 0 0 12px;">
                🟡 Menções institucionais — PMTO ({len(institucionais)})
            </h2>
        """
        for a in institucionais:
            html += f"""
            <div style="padding: 14px; background: #fffbeb; border-radius: 8px;
                        border-left: 3px solid #f59e0b; margin-bottom: 10px;">
                <p style="margin: 0 0 4px; font-size: 10px; color: #94a3b8;
                          text-transform: uppercase; font-weight: 700;">
                    {a.source_name} · {a.source_type}
                </p>
                <p style="margin: 0 0 6px; font-size: 15px; font-weight: 600;
                          color: #0f172a;">
                    {a.title}
                </p>
                <a href="{a.url}" style="display: inline-block; margin-top: 4px;
                   font-size: 12px; color: #3b82f6; text-decoration: none;
                   font-weight: 600;">
                    Abrir matéria →
                </a>
            </div>
            """
        html += "</div>"
 
    html += """
        <div style="border-top: 1px solid #e2e8f0; padding-top: 14px;
                    margin-top: 8px;">
            <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                Monitor de Menções — PMTO · Gerado automaticamente
            </p>
        </div>
    </div>
    </body>
    </html>
    """
    return html
 
 
def build_email_subject(articles: list[Article]) -> str:
    """Gera o assunto do e-mail com base na gravidade."""
    diretas = [a for a in articles if a.mention_type == "direta"]
    nacionais = [a for a in articles if a.scope == "BR"]
    total = len(articles)
 
    prefix = "🔴" if diretas else "🟡"
    scope_tag = f" [{len(nacionais)} nacional]" if nacionais else ""
    if diretas:
        return f"{prefix} [{len(diretas)} direta(s)]{scope_tag} Alerta Cel. Barbosa — {total} menção(ões)"
    return f"{prefix}{scope_tag} Alerta PMTO — {total} menção(ões)"
 
 
def send_email(articles: list[Article]) -> bool:
    """Envia e-mail de alerta via Gmail SMTP."""
    if not GMAIL_APP_PASSWORD:
        logger.error(
            "GMAIL_APP_PASSWORD não configurada no .env. "
            "Gere uma Senha de App em https://myaccount.google.com/apppasswords"
        )
        return False
 
    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = GMAIL_ADDRESS
        msg["To"] = NOTIFY_TO
        msg["Subject"] = build_email_subject(articles)
 
        # Corpo em texto puro (fallback)
        plain_lines = [f"Alerta PMTO — {len(articles)} menção(ões)\n"]
        for a in articles:
            plain_lines.append(
                f"[{a.mention_type.upper()}] [{a.source_name}] {a.title}\n"
                f"  {a.url}\n"
            )
        msg.attach(MIMEText("\n".join(plain_lines), "plain", "utf-8"))
 
        # Corpo em HTML (principal)
        msg.attach(MIMEText(build_email_html(articles), "html", "utf-8"))
 
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
            server.sendmail(GMAIL_ADDRESS, NOTIFY_TO, msg.as_string())
 
        logger.info(f"E-mail de alerta enviado para {NOTIFY_TO}.")
        return True
 
    except smtplib.SMTPAuthenticationError:
        logger.error(
            "Falha na autenticação Gmail. Verifique se a Senha de App "
            "está correta e se a verificação em 2 etapas está ativa."
        )
        return False
    except Exception as e:
        logger.error(f"Erro ao enviar e-mail: {e}")
        return False
 
 
def send_notification(articles: list[Article]):
    """Envia notificação por e-mail."""
    if not articles:
        return
 
    success = send_email(articles)
 
    # Fallback: salva no log se notificação falhou
    if not success:
        logger.warning("Notificação por e-mail falhou. Resumo salvo no log:")
        for a in articles:
            logger.info(f"  [{a.mention_type}] [{a.source_name}] {a.title} → {a.url}")
 
 
# ─────────────────────────────────────────────
# LOOP PRINCIPAL
# ─────────────────────────────────────────────
 
def run_scan():
    """Executa uma varredura completa em todas as fontes."""
    logger.info("=" * 50)
    logger.info("Iniciando varredura de menções...")
    logger.info("=" * 50)
 
    seen = load_seen()
    new_mentions: list[Article] = []
    stats = {"fontes_ok": 0, "fontes_erro": 0, "artigos_analisados": 0}
 
    for source in SOURCES:
        logger.info(f"Varrendo: {source.name} ({source.full_url})")
 
        soup = fetch_page(source.full_url)
        if not soup:
            stats["fontes_erro"] += 1
            continue
 
        stats["fontes_ok"] += 1
        raw_articles = extract_articles(soup, source)
        logger.info(f"  → {len(raw_articles)} artigos extraídos")
 
        for raw in raw_articles:
            stats["artigos_analisados"] += 1
 
            # Verifica menções
            check = check_mentions(raw["title"])
            if not check["is_match"]:
                continue
 
            # Cria o artigo
            article = Article(
                title=raw["title"],
                url=raw["url"],
                source_name=source.name,
                source_type=source.source_type,
                priority=source.priority,
                scope=source.scope,
                matched_terms=check["matched_terms"] + check["crisis_terms"] + check["electoral_terms"],
                mention_type=check["mention_type"],
            )
 
            # Verifica se já foi notificado
            if article.hash_id in seen:
                continue
 
            # Nova menção encontrada!
            seen.add(article.hash_id)
            new_mentions.append(article)
            logger.info(
                f"  🔔 NOVA MENÇÃO [{check['mention_type'].upper()}]: "
                f"{raw['title'][:80]}..."
            )
 
    # Salva estado
    save_seen(seen)
 
    if new_mentions:
        save_to_history(new_mentions)
        logger.info(f"\n✅ {len(new_mentions)} nova(s) menção(ões) detectada(s)!")
        send_notification(new_mentions)
    else:
        logger.info("\n— Nenhuma nova menção detectada nesta varredura.")
 
    # Resumo
    logger.info(
        f"\nResumo: {stats['fontes_ok']}/{len(SOURCES)} fontes OK | "
        f"{stats['fontes_erro']} erros | "
        f"{stats['artigos_analisados']} artigos analisados | "
        f"{len(new_mentions)} novas menções"
    )
 
    return new_mentions
 
 
# ─────────────────────────────────────────────
# PONTO DE ENTRADA
# ─────────────────────────────────────────────
 
if __name__ == "__main__":
    run_scan()
 
 
# =================================================================
# COMO AGENDAR A EXECUÇÃO (2x por dia)
# =================================================================
#
# ── WINDOWS (Task Scheduler) ──
# 1. Abra o Agendador de Tarefas (Task Scheduler)
# 2. Clique em "Criar Tarefa Básica"
# 3. Nome: "Monitor PMTO"
# 4. Disparador: "Diariamente"
# 5. Ação: "Iniciar um programa"
#    Programa: python
#    Argumentos: C:\caminho\para\pmto_monitor.py
# 6. Repita para o segundo horário
#
# Ou via PowerShell (cria duas tarefas: 7h e 19h):
#
#   $action = New-ScheduledTaskAction -Execute "python" `
#     -Argument "C:\caminho\para\pmto_monitor.py"
#   $trigger1 = New-ScheduledTaskTrigger -Daily -At 7:00AM
#   $trigger2 = New-ScheduledTaskTrigger -Daily -At 7:00PM
#   Register-ScheduledTask -TaskName "Monitor PMTO Manhã" `
#     -Action $action -Trigger $trigger1
#   Register-ScheduledTask -TaskName "Monitor PMTO Noite" `
#     -Action $action -Trigger $trigger2
#
# ── MAC/LINUX (cron) ──
# Execute: crontab -e
# Adicione estas linhas (7h e 19h):
#
#   0 7 * * * /usr/bin/python3 /caminho/para/pmto_monitor.py
#   0 19 * * * /usr/bin/python3 /caminho/para/pmto_monitor.py
#
# =================================================================
 
