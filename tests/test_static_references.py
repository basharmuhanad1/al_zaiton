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
        for attr, value in attrs:
            if attr in {"href", "src"} and value:
                self.references.append((tag, attr, value))


def is_local_reference(value):
    parsed = urlparse(value)
    return not parsed.scheme and not parsed.netloc and not value.startswith("#")


class StaticReferenceTests(unittest.TestCase):
    def test_local_html_references_exist(self):
        missing = []

        for html_path in sorted(ROOT.glob("*.html")):
            parser = ReferenceParser()
            parser.feed(html_path.read_text(encoding="utf-8"))

            for tag, attr, value in parser.references:
                if not is_local_reference(value):
                    continue

                target = (html_path.parent / value.split("#", 1)[0]).resolve()
                try:
                    target.relative_to(ROOT)
                except ValueError:
                    missing.append((html_path.name, tag, attr, value))
                    continue

                if not target.exists():
                    missing.append((html_path.name, tag, attr, value))

        self.assertEqual([], missing)


if __name__ == "__main__":
    unittest.main()
