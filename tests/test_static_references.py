import unittest
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
                self.references.append(value)


def is_local_reference(reference):
    parsed = urlparse(reference)
    return not parsed.scheme and not parsed.netloc and not reference.startswith("#")


class StaticReferenceTests(unittest.TestCase):
    def test_top_level_html_references_resolve(self):
        missing = []

        for html_file in sorted(ROOT.glob("*.html")):
            parser = ReferenceParser()
            parser.feed(html_file.read_text(encoding="utf-8"))

            for reference in parser.references:
                if not is_local_reference(reference):
                    continue

                path = urlparse(reference).path
                target = (html_file.parent / path).resolve()
                try:
                    target.relative_to(ROOT)
                except ValueError:
                    missing.append(f"{html_file.name}: {reference} escapes the repository")
                    continue

                if not target.exists():
                    missing.append(f"{html_file.name}: {reference}")

        self.assertEqual([], missing)


if __name__ == "__main__":
    unittest.main()
