from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
import unittest


REPO_ROOT = Path(__file__).resolve().parents[1]


class StaticReferenceParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.references = []

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name in {"href", "src"} and value:
                self.references.append((tag, name, value))


def is_local_reference(value):
    parsed = urlparse(value)
    return not parsed.scheme and not parsed.netloc and not value.startswith("#")


class StaticReferenceTests(unittest.TestCase):
    def test_local_html_references_exist(self):
        missing = []

        for html_file in sorted(REPO_ROOT.glob("*.html")):
            parser = StaticReferenceParser()
            parser.feed(html_file.read_text(encoding="utf-8"))

            for tag, attr, value in parser.references:
                if not is_local_reference(value):
                    continue

                target_path = urlparse(value).path
                target = (html_file.parent / target_path).resolve()
                try:
                    target.relative_to(REPO_ROOT)
                except ValueError:
                    missing.append(f"{html_file.name}: {tag}[{attr}] escapes repo: {value}")
                    continue

                if not target.exists():
                    missing.append(f"{html_file.name}: {tag}[{attr}] missing: {value}")

        self.assertEqual([], missing)


if __name__ == "__main__":
    unittest.main()
