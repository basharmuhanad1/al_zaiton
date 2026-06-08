from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse
import unittest


REPO_ROOT = Path(__file__).resolve().parents[1]


class ReferenceParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.references = []

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name in {"href", "src"} and value:
                self.references.append((tag, name, value))


def is_local_reference(reference):
    parsed = urlparse(reference)
    return not parsed.scheme and not parsed.netloc and parsed.path


class StaticReferenceTests(unittest.TestCase):
    def test_local_html_references_exist(self):
        missing = []

        for html_file in sorted(REPO_ROOT.glob("*.html")):
            parser = ReferenceParser()
            parser.feed(html_file.read_text(encoding="utf-8"))

            for tag, attr, reference in parser.references:
                if not is_local_reference(reference):
                    continue

                referenced_path = html_file.parent / unquote(urlparse(reference).path)
                if not referenced_path.exists():
                    missing.append(
                        f"{html_file.name}: <{tag} {attr}=\"{reference}\"> -> "
                        f"{referenced_path.relative_to(REPO_ROOT)}"
                    )

        self.assertEqual([], missing)


if __name__ == "__main__":
    unittest.main()
