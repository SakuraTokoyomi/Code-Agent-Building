import os
import requests
import xml.etree.ElementTree as ET
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# ArXiv API base URL
ARXIV_API_BASE_URL = 'http://export.arxiv.org/api/query'

# CS Categories to support
CS_CATEGORIES = [
    'cs.AI', 'cs.CL', 'cs.CV', 'cs.DB', 'cs.DC', 
    'cs.DL', 'cs.GR', 'cs.HC', 'cs.IR', 'cs.IT', 
    'cs.LG', 'cs.MA', 'cs.MM', 'cs.NE', 'cs.PL', 
    'cs.RO', 'cs.SE', 'cs.SI', 'cs.SY'
]

def parse_arxiv_xml(xml_content):
    """
    Parse ArXiv XML response and convert to JSON-friendly format
    """
    try:
        root = ET.fromstring(xml_content)
        
        # Define XML namespaces
        namespaces = {
            'atom': 'http://www.w3.org/2005/Atom',
            'arxiv': 'http://arxiv.org/schemas/atom'
        }
        
        papers = []
        for entry in root.findall('atom:entry', namespaces):
            try:
                paper = {
                    'id': entry.find('atom:id', namespaces).text.split('/')[-1],
                    'title': entry.find('atom:title', namespaces).text.strip(),
                    'summary': entry.find('atom:summary', namespaces).text.strip(),
                    'published': entry.find('atom:published', namespaces).text,
                    'authors': [
                        author.find('atom:name', namespaces).text 
                        for author in entry.findall('atom:author', namespaces)
                    ],
                    'links': {
                        'pdf': next(
                            (link.get('href') for link in entry.findall('atom:link', namespaces) 
                             if link.get('type') == 'application/pdf'), 
                            None
                        ),
                        'abs': next(
                            (link.get('href') for link in entry.findall('atom:link', namespaces) 
                             if link.get('rel') == 'alternate'), 
                            None
                        )
                    },
                    'categories': [
                        cat.get('term') for cat in entry.findall('arxiv:primary_category', namespaces)
                    ] + [
                        cat.get('term') for cat in entry.findall('atom:category', namespaces)
                    ]
                }
                papers.append(paper)
            except Exception as entry_error:
                logger.warning(f"Error parsing individual entry: {entry_error}")
        
        return papers
    except Exception as parse_error:
        logger.error(f"XML Parsing Error: {parse_error}")
        return []

@app.route('/arxiv/papers', methods=['GET'])
def fetch_arxiv_papers():
    """
    Proxy route for fetching ArXiv papers with robust error handling
    """
    try:
        # Extract query parameters
        category = request.args.get('category', 'cs.AI')
        max_results = int(request.args.get('max_results', 20))
        start = int(request.args.get('start', 0))

        # Validate category
        if category not in CS_CATEGORIES:
            return jsonify({
                'error': 'Invalid category',
                'valid_categories': CS_CATEGORIES
            }), 400

        # Construct ArXiv API query
        params = {
            'search_query': f'cat:{category}',
            'start': start,
            'max_results': max_results,
            'sortBy': 'submittedDate',
            'sortOrder': 'descending'
        }

        # Make request to ArXiv API
        try:
            response = requests.get(ARXIV_API_BASE_URL, params=params)
            response.raise_for_status()
        except requests.RequestException as req_error:
            logger.error(f"ArXiv API Request Error: {req_error}")
            return jsonify({
                'error': 'Failed to fetch papers from ArXiv',
                'details': str(req_error)
            }), 500

        # Parse XML response
        papers = parse_arxiv_xml(response.text)

        return jsonify({
            'papers': papers,
            'total_results': len(papers),
            'category': category,
            'timestamp': datetime.utcnow().isoformat()
        })

    except Exception as e:
        logger.error(f"Unexpected error in fetch_arxiv_papers: {e}")
        return jsonify({
            'error': 'Unexpected server error',
            'details': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)