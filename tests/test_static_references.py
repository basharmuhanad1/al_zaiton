from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]


class ReferenceParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.references = []

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name in {"href", "src"} and value:
                self.references.append((tag, name, value))


def is_local_reference(value):
    parsed = urlparse(value)
    return not parsed.scheme and not parsed.netloc and not value.startswith(("#", "mailto:", "tel:"))


def test_local_html_references_exist():
    missing = []

    for html_file in ROOT.glob("*.html"):
        parser = ReferenceParser()
        parser.feed(html_file.read_text(encoding="utf-8"))

        for tag, attr, value in parser.references:
            if not is_local_reference(value):
                continue

            target = html_file.parent / value.split("#", 1)[0].split("?", 1)[0]
            if not target.exists():
                missing.append(f"{html_file.name}: <{tag} {attr}=\"{value}\">")

    assert not missing, "Missing local references:\n" + "\n".join(missing)
