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
            target = attrs.get(attribute)
            if target:
                self.references.append((tag, attribute, target))


def is_local_reference(target):
    parsed = urlparse(target)
    return not parsed.scheme and not parsed.netloc and not target.startswith(("#", "mailto:", "tel:"))


class StaticReferenceTests(unittest.TestCase):
    def test_local_html_references_exist(self):
        missing = []

        for html_file in sorted(ROOT.glob("*.html")):
            parser = StaticReferenceParser()
            parser.feed(html_file.read_text(encoding="utf-8"))

            for tag, attribute, target in parser.references:
                if not is_local_reference(target):
                    continue

                path = urlparse(target).path
                referenced = (html_file.parent / path).resolve()

                try:
                    referenced.relative_to(ROOT)
                except ValueError:
                    missing.append(f"{html_file.name}: {tag} {attribute} escapes repo: {target}")
                    continue

                if not referenced.exists():
                    missing.append(f"{html_file.name}: {tag} {attribute} missing: {target}")

        self.assertEqual([], missing)


if __name__ == "__main__":
    unittest.main()
