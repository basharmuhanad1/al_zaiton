from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
import unittest


ROOT = Path(__file__).resolve().parents[1]


class StaticReferenceParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.references = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        for attr in ("href", "src"):
            value = attrs.get(attr)
            if value:
                self.references.append((tag, attr, value))


def is_local_reference(value):
    parsed = urlparse(value)
    return not parsed.scheme and not parsed.netloc and not value.startswith("#")


class StaticReferenceTests(unittest.TestCase):
    def test_local_static_references_exist(self):
        missing = []

        for html_file in sorted(ROOT.glob("*.html")):
            parser = StaticReferenceParser()
            parser.feed(html_file.read_text(encoding="utf-8"))

            for tag, attr, value in parser.references:
                if not is_local_reference(value):
                    continue

                referenced_path = (html_file.parent / value.split("#", 1)[0]).resolve()
                try:
                    referenced_path.relative_to(ROOT)
                except ValueError:
                    missing.append(f"{html_file.name}: {tag}[{attr}] escapes repo: {value}")
                    continue

                if not referenced_path.exists():
                    missing.append(f"{html_file.name}: {tag}[{attr}] missing: {value}")

        self.assertEqual([], missing)
