from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import unittest


ROOT = Path(__file__).resolve().parents[1]


class ReferenceParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.references = []

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name in {"href", "src"} and value:
                self.references.append((tag, name, value))


def is_local_reference(value):
    parsed = urlsplit(value)
    return not parsed.scheme and not parsed.netloc and parsed.path


class StaticReferenceTests(unittest.TestCase):
    def test_local_html_references_exist(self):
        missing = []

        for html_file in sorted(ROOT.glob("*.html")):
            parser = ReferenceParser()
            parser.feed(html_file.read_text(encoding="utf-8"))

            for _tag, attr, value in parser.references:
                if not is_local_reference(value):
                    continue

                path = unquote(urlsplit(value).path)
                target = ROOT / path.lstrip("/") if path.startswith("/") else html_file.parent / path

                if not target.exists():
                    missing.append(f"{html_file.name} {attr}={value!r}")

        self.assertEqual([], missing)
