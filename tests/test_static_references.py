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
        for attribute in ("href", "src"):
            if attribute in attrs:
                self.references.append((tag, attribute, attrs[attribute]))


def is_local_reference(reference):
    parsed = urlparse(reference)
    return not parsed.scheme and not parsed.netloc and not reference.startswith("#")


class StaticReferenceTests(unittest.TestCase):
    def test_local_html_references_exist(self):
        missing = []

        for html_file in sorted(ROOT.glob("*.html")):
            parser = StaticReferenceParser()
            parser.feed(html_file.read_text(encoding="utf-8"))

            for tag, attribute, reference in parser.references:
                if not is_local_reference(reference):
                    continue

                path = urlparse(reference).path
                if not path:
                    continue

                target = (html_file.parent / path).resolve()
                if not target.exists():
                    missing.append(
                        f"{html_file.name}: <{tag} {attribute}=\"{reference}\">"
                    )

        self.assertEqual([], missing)
