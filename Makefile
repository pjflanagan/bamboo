.PHONY: help dev manifest refine print lyrics

help:
	@echo "Usage:"
	@echo "  make dev                            Start the Next.js dev server"
	@echo "  make manifest                       Regenerate data/flashcard-sets.json"
	@echo "  make lyrics file=<path>             Format a lyrics txt file to csv"
	@echo "    e.g. make lyrics file=data/songs/lo_tayu_childhood.txt"
	@echo "  make refine type=<unit|class> args=<args>  Refine a set"
	@echo "    e.g. make refine type=unit args=songs/wu_bai_norweigan_forest"
	@echo "    e.g. make refine type=class args=verbs"
	@echo "  make print type=<unit|class> args=<args>   Print a set to PDF"
	@echo "    e.g. make print type=unit args=songs/wu_bai_norweigan_forest"
	@echo "    e.g. make print type=class args='verbs 2'"

dev:
	npm run dev

manifest:
	python3 scripts/gen_sets_manifest.py

lyrics:
	python3 scripts/format_lyrics.py $(file)

refine:
	python3 scripts/refine.py $(type) $(args)

print:
	python3 scripts/print.py $(type) $(args)
