import unittest
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
REFERENCE_ATTRIBUTES = ("href", "src")
EXTERNAL_SCHEMES = {"http", "https", "mailto", "tel", "data", "javascript"}


class ReferenceParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.references = []

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name in REFERENCE_ATTRIBUTES and value:
                self.references.append((tag, name, value))


def local_references(html_path):
    parser = ReferenceParser()
    parser.feed(html_path.read_text(encoding="utf-8"))

    for tag, attr, raw_value in parser.references:
        parsed = urlparse(raw_value)
        if parsed.scheme in EXTERNAL_SCHEMES or parsed.netloc:
            continue
        if not parsed.path:
            continue
        yield tag, attr, raw_value, parsed.path


class StaticReferenceTests(unittest.TestCase):
    def test_local_html_references_exist(self):
        missing = []

        for html_path in ROOT.glob("*.html"):
            for tag, attr, raw_value, reference_path in local_references(html_path):
                resolved = (html_path.parent / reference_path).resolve()
                try:
                    resolved.relative_to(ROOT)
                except ValueError:
                    missing.append(f"{html_path.name}: {tag}[{attr}] escapes repo: {raw_value}")
                    continue

                if not resolved.exists():
                    missing.append(f"{html_path.name}: {tag}[{attr}] missing: {raw_value}")

        self.assertEqual([], missing)


if __name__ == "__main__":
    unittest.main()
