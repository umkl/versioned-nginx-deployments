# blog

This repository contains the blog content itself as well as the tools to update the serving host - no CMS, no WYSIWYG, no external sources. 

## rules

The content is structured in a very straightforward way, adhering to basic html semantics. 

The structure for new blogs items looks like this:

`html > main > article`

An article consists of these elements:
`h2` - Topic of the Blog.
`p` - Subheading containing a TLDR. 
`time` - Information about the Creation Date of the Blog.
`p` - Actual content of the blog.
