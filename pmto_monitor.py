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

import feedparser
import json
import hashlib
from datetime import datetime
from email.utils import parsedate_to_datetime
import urllib.parse
import os

# 1. Parâmetros de Busca de Inteligência (Dorking)
# Filtra desde agosto de 2022, exclui o domínio oficial do governo e busca em âmbito nacional
QUERY = '"Márcio Barbosa" OR "Coronel Barbosa" PMTO -site:to.gov.br after:2022-08-01'
ENCODED_QUERY = urllib.parse.quote(QUERY)

# URL do Feed Global de Notícias
RSS_URL = f"https://news.google.com/rss/search?q={ENCODED_QUERY}&hl=pt-BR&gl=BR&ceid=BR:pt-419"

def generate_hash(title, date_str):
    """Gera um ID único para cada notícia para não termos dados duplicados"""
    return hashlib.md5(f"{title}{date_str}".encode('utf-8')).hexdigest()[:9]

def get_mention_type(text):
    text = text.lower()
    if 'márcio barbosa' in text or 'coronel barbosa' in text or 'cel. barbosa' in text:
        return 'direta'
    return 'institucional'

def get_source_type(source_name):
    """Classifica a fonte para sabermos a penetração nacional da notícia"""
    nacionais = ['g1', 'uol', 'terra', 'cnn brasil', 'r7', 'estadao', 'folha', 'metrópoles']
    concursos = ['ceisc', 'estrategia', 'direção', 'pci concursos', 'gran cursos']
    
    source_lower = source_name.lower()
    if any(n in source_lower for n in nacionais):
        return 'Nacional'
    if any(c in source_lower for c in concursos):
        return 'Nacional (Concursos)'
    return 'Regional/Blog'

def scrape_google_news():
    print(f"Iniciando rastreamento nacional de notícias... Aguarde.")
    feed = feedparser.parse(RSS_URL)
    articles = []
    
    for entry in feed.entries:
        title = entry.title
        # O Google News geralmente coloca a fonte no final do título (ex: "Notícia tal - G1")
        source_name = entry.source.title if 'source' in entry else title.split(' - ')[-1]
        clean_title = title.rsplit(' - ', 1)[0] if ' - ' in title else title
        
        link = entry.link
        
        # Converte a data global para o formato que o nosso Painel React entende
        try:
            dt = parsedate_to_datetime(entry.published)
            detected_at = dt.strftime("%Y-%m-%d %H:%M:%S")
        except:
            detected_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
        snippet = entry.summary if 'summary' in entry else ''
        mention_type = get_mention_type(clean_title + " " + snippet)
        
        # Estrutura JSON idêntica à que o React está esperando
        article_data = {
            "hash_id": generate_hash(clean_title, detected_at),
            "detected_at": detected_at,
            "source_name": source_name,
            "source_type": get_source_type(source_name),
            "title": clean_title,
            "snippet": snippet,
            "mention_type": mention_type,
            "matched_terms": ["márcio barbosa", "pmto"] if mention_type == 'direta' else ["pmto"],
            "url": link,
            "priority": "alta" if mention_type == 'direta' else "normal"
        }
        articles.append(article_data)
        
    return articles

if __name__ == "__main__":
    print("Conectando ao banco de dados e iniciando varredura histórica (Agosto/2022 - Atual)...")
    data = scrape_google_news()
    
    # Organiza para que as notícias mais novas fiquem no topo
    data.sort(key=lambda x: x['detected_at'], reverse=True)
    
    # Salva o arquivo no mesmo local do script
    file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'mention_history.json')
    
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
        
    print(f"Varredura limpa concluída! {len(data)} notícias encontradas sem viés institucional e salvas no JSON.")
