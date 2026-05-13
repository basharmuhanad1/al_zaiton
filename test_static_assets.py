from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
import unittest


ROOT = Path(__file__).resolve().parent
EXTERNAL_SCHEMES = {"http", "https", "mailto", "tel"}


class LocalReferenceParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.references = []

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name in {"href", "src"} and value:
                self.references.append((tag, name, value))


class StaticAssetTests(unittest.TestCase):
    def test_local_html_references_exist(self):
        missing = []

        for html_file in sorted(ROOT.glob("*.html")):
            parser = LocalReferenceParser()
            parser.feed(html_file.read_text(encoding="utf-8"))

            for tag, name, value in parser.references:
                parsed = urlparse(value)
                if parsed.scheme in EXTERNAL_SCHEMES or parsed.path in {"", "#"}:
                    continue

                target = (html_file.parent / parsed.path).resolve()
                if not target.exists():
                    missing.append(f"{html_file.name}: <{tag} {name}=\"{value}\">")

        self.assertEqual([], missing)


if __name__ == "__main__":
    unittest.main()
