import unittest
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse


REPO_ROOT = Path(__file__).resolve().parents[1]


class ReferenceParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.references = []

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name in {"href", "src"} and value:
                self.references.append(value)


def is_local_reference(value):
    parsed = urlparse(value)
    return not parsed.scheme and not parsed.netloc and not value.startswith("#")


class StaticReferenceTests(unittest.TestCase):
    def test_local_html_references_exist(self):
        missing = []

        for html_file in sorted(REPO_ROOT.glob("*.html")):
            parser = ReferenceParser()
            parser.feed(html_file.read_text(encoding="utf-8"))

            for reference in parser.references:
                if not is_local_reference(reference):
                    continue

                path = urlparse(reference).path
                if not path:
                    continue

                target = (html_file.parent / unquote(path)).resolve()
                if not target.exists():
                    missing.append(f"{html_file.name}: {reference}")

        self.assertEqual([], missing)


if __name__ == "__main__":
    unittest.main()
