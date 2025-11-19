.PHONY: build serve serve-drafts

build:
	bundle exec jekyll build

serve:
	bundle exec jekyll serve --livereload

serve-drafts:
	bundle exec jekyll serve --livereload --drafts
