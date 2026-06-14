from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse
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
    parsed = urlparse(value)
    return not parsed.scheme and not parsed.netloc and parsed.path


class StaticReferenceTests(unittest.TestCase):
    def test_local_html_references_exist(self):
        missing = []

        for html_path in ROOT.glob("*.html"):
            parser = ReferenceParser()
            parser.feed(html_path.read_text(encoding="utf-8"))

            for tag, attr, value in parser.references:
                if not is_local_reference(value):
                    continue

                target = (html_path.parent / unquote(urlparse(value).path)).resolve()
                try:
                    target.relative_to(ROOT)
                except ValueError:
                    missing.append(f"{html_path.name}: {tag} {attr} escapes repository: {value}")
                    continue

                if not target.exists():
                    missing.append(f"{html_path.name}: {tag} {attr} points to missing file: {value}")

        self.assertEqual([], missing)


if __name__ == "__main__":
    unittest.main()
