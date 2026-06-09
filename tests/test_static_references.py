from html.parser import HTMLParser
from pathlib import Path
from unittest import TestCase
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]


class StaticReferenceParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.references = []

    def handle_starttag(self, tag, attrs):
        for attr_name, attr_value in attrs:
            if attr_name in {"href", "src"} and attr_value:
                self.references.append((tag, attr_name, attr_value))


def is_local_reference(value):
    parsed = urlparse(value)
    return not (
        parsed.scheme
        or parsed.netloc
        or value.startswith("#")
        or value.startswith("//")
    )


class StaticReferenceTests(TestCase):
    def test_top_level_html_references_exist(self):
        missing_references = []

        for html_path in sorted(ROOT.glob("*.html")):
            parser = StaticReferenceParser()
            parser.feed(html_path.read_text(encoding="utf-8"))

            for tag, attr_name, attr_value in parser.references:
                if not is_local_reference(attr_value):
                    continue

                target = html_path.parent / urlparse(attr_value).path
                if not target.exists():
                    missing_references.append(
                        f"{html_path.name}: <{tag}> {attr_name}={attr_value!r}"
                    )

        self.assertEqual([], missing_references)
