from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
import unittest


ROOT = Path(__file__).resolve().parent


class ReferenceParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.references = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        for attr in ("href", "src"):
            target = attrs.get(attr)
            if target:
                self.references.append((tag, attr, target))


def is_local_file_reference(target):
    parsed = urlparse(target)
    return not parsed.scheme and not parsed.netloc and not target.startswith("#")


class StaticReferenceTests(unittest.TestCase):
    def test_local_html_references_exist(self):
        missing = []

        for html_file in ROOT.glob("*.html"):
            parser = ReferenceParser()
            parser.feed(html_file.read_text(encoding="utf-8"))

            for tag, attr, target in parser.references:
                if not is_local_file_reference(target):
                    continue

                reference_path = target.split("#", 1)[0].split("?", 1)[0]
                if not reference_path:
                    continue

                resolved = (html_file.parent / reference_path).resolve()
                try:
                    resolved.relative_to(ROOT)
                except ValueError:
                    missing.append(f"{html_file.name}: {tag}[{attr}] escapes root: {target}")
                    continue

                if not resolved.exists():
                    missing.append(f"{html_file.name}: {tag}[{attr}] missing: {target}")

        self.assertEqual([], missing)


if __name__ == "__main__":
    unittest.main()
