from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
import unittest


ROOT = Path(__file__).resolve().parents[1]


class ReferenceParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.references = []

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name in {"href", "src"} and value:
                self.references.append(value)


class StaticReferenceTests(unittest.TestCase):
    def test_local_html_references_exist(self):
        missing = []

        for html_file in ROOT.glob("*.html"):
            parser = ReferenceParser()
            parser.feed(html_file.read_text(encoding="utf-8"))

            for reference in parser.references:
                parsed = urlparse(reference)
                if parsed.scheme or parsed.netloc or reference.startswith("#"):
                    continue

                target = (html_file.parent / parsed.path).resolve()
                try:
                    target.relative_to(ROOT)
                except ValueError:
                    missing.append(f"{html_file.name}: {reference} escapes repository")
                    continue

                if not target.exists():
                    missing.append(f"{html_file.name}: {reference}")

        self.assertEqual([], missing)


if __name__ == "__main__":
    unittest.main()
