from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse
import unittest


ROOT = Path(__file__).resolve().parents[1]


class ReferenceParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.references = []
        self.image_sources = []

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if value is None:
                continue
            if name in {"href", "src"}:
                self.references.append((name, value))
            if tag == "img" and name == "src":
                self.image_sources.append(value)


def parse_html(path):
    parser = ReferenceParser()
    parser.feed(path.read_text(encoding="utf-8"))
    return parser


def local_target(page, reference):
    parsed = urlparse(reference.strip())
    if parsed.scheme or parsed.netloc or parsed.path in {"", "#"}:
        return None

    path = unquote(parsed.path)
    if path.startswith("/"):
        return ROOT / path.lstrip("/")
    return page.parent / path


class StaticReferenceTests(unittest.TestCase):
    def test_local_href_and_src_targets_exist(self):
        missing = []
        for page in ROOT.glob("*.html"):
            for attr, reference in parse_html(page).references:
                target = local_target(page, reference)
                if target is not None and not target.exists():
                    missing.append(
                        f"{page.name} {attr}={reference!r} -> {target.relative_to(ROOT)}"
                    )

        self.assertEqual([], missing)

    def test_products_page_uses_committed_product_images(self):
        sources = parse_html(ROOT / "products.html").image_sources

        self.assertEqual({f"{index}.jpg" for index in range(1, 9)}, set(sources))
        self.assertEqual(8, len(sources))


if __name__ == "__main__":
    unittest.main()
