from html.parser import HTMLParser
from pathlib import Path
import unittest
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]


class StaticReferenceParser(HTMLParser):
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
    def test_local_static_references_exist(self):
        missing = []

        for html_file in ROOT.glob("*.html"):
            parser = StaticReferenceParser()
            parser.feed(html_file.read_text(encoding="utf-8"))

            for reference in parser.references:
                if not is_local_reference(reference):
                    continue

                target = (html_file.parent / urlparse(reference).path).resolve()
                try:
                    target.relative_to(ROOT)
                except ValueError:
                    missing.append(f"{html_file.name}: {reference} escapes site root")
                    continue

                if not target.exists():
                    missing.append(f"{html_file.name}: {reference}")

        self.assertEqual([], missing)


if __name__ == "__main__":
    unittest.main()
