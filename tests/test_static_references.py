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


def local_references(html_path):
    parser = ReferenceParser()
    parser.feed(html_path.read_text(encoding="utf-8"))

    for reference in parser.references:
        parsed = urlparse(reference)
        if parsed.scheme or parsed.netloc or parsed.path.startswith("#"):
            continue
        yield reference, parsed.path


class StaticReferenceTests(unittest.TestCase):
    def test_local_html_references_resolve(self):
        missing = []

        for html_path in sorted(ROOT.glob("*.html")):
            for reference, path in local_references(html_path):
                resolved = (html_path.parent / path).resolve()
                try:
                    resolved.relative_to(ROOT)
                except ValueError:
                    missing.append(f"{html_path.name}: {reference} escapes repository")
                    continue

                if not resolved.is_file():
                    missing.append(f"{html_path.name}: {reference}")

        self.assertEqual([], missing)


if __name__ == "__main__":
    unittest.main()
