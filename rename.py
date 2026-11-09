"""Ganti placeholder 'username' dengan username kamu.
Pakai:  python rename.py abdullah_ubaid
"""
import os, sys

if len(sys.argv) != 2:
    sys.exit("Pakai: python rename.py <username>")
u = sys.argv[1]
OLD_PKG, NEW_PKG = "usernamepbo2026springbootcashflow", f"{u}pbo2026springbootcashflow"
OLD_ART, NEW_ART = "username-pbo2026-springboot-cashflow", f"{u}-pbo2026-springboot-cashflow"

for root, _, files in os.walk("."):
    for f in files:
        if f.endswith((".java", ".xml", ".yaml")):
            p = os.path.join(root, f)
            s = open(p, encoding="utf-8").read()
            n = s.replace(OLD_PKG, NEW_PKG).replace(OLD_ART, NEW_ART)
            if n != s:
                open(p, "w", encoding="utf-8").write(n)

for base in ("src/main/java/org/delcom", "src/test/java/org/delcom"):
    old = os.path.join(base, OLD_PKG)
    if os.path.isdir(old):
        os.rename(old, os.path.join(base, NEW_PKG))
print("Selesai. Buka ulang proyek di IntelliJ / reload Maven.")
