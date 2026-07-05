import html.parser
import unittest
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]


class ReferenceParser(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.references = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        for attribute in ("href", "src"):
            value = attrs.get(attribute)
            if value:
                self.references.append((tag, attribute, value))


def is_local_reference(value):
    parsed = urlparse(value)
    return not parsed.scheme and not parsed.netloc and not value.startswith(("#", "mailto:", "tel:"))


class StaticReferenceTests(unittest.TestCase):
    def test_top_level_html_local_references_exist(self):
        missing = []

        for html_file in ROOT.glob("*.html"):
            parser = ReferenceParser()
            parser.feed(html_file.read_text(encoding="utf-8"))

            for tag, attribute, value in parser.references:
                if not is_local_reference(value):
                    continue

                target = (html_file.parent / urlparse(value).path).resolve()
                try:
                    target.relative_to(ROOT)
                except ValueError:
                    missing.append(f"{html_file.name}: {tag}[{attribute}] escapes repo: {value}")
                    continue

                if not target.exists():
                    missing.append(f"{html_file.name}: {tag}[{attribute}] missing: {value}")

        self.assertEqual([], missing)


if __name__ == "__main__":
    unittest.main()
