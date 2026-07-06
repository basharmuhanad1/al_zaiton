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
        for attr_name, attr_value in attrs:
            if attr_name in {"href", "src"} and attr_value:
                self.references.append(attr_value)


def is_local_reference(reference):
    parsed = urlparse(reference)
    return (
        not parsed.scheme
        and not parsed.netloc
        and not reference.startswith("#")
    )


class StaticReferenceTests(unittest.TestCase):
    def test_local_html_references_resolve(self):
        missing = []

        for html_file in ROOT.glob("*.html"):
            parser = ReferenceParser()
            parser.feed(html_file.read_text(encoding="utf-8"))

            for reference in parser.references:
                if not is_local_reference(reference):
                    continue

                parsed = urlparse(reference)
                target = (html_file.parent / parsed.path).resolve()
                try:
                    target.relative_to(ROOT)
                except ValueError:
                    missing.append(f"{html_file.name}: {reference} escapes repository root")
                    continue

                if not target.exists():
                    missing.append(f"{html_file.name}: {reference}")

        self.assertEqual([], missing)


if __name__ == "__main__":
    unittest.main()
