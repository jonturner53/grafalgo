JROOT := ~/bin/java

all:
	make -C basic 		JROOT='${JROOT}' all
	make -C graphs		JROOT='${JROOT}' all
	make -C heaps		JROOT='${JROOT}' all
	make -C searchTrees	JROOT='${JROOT}' all
	make -C advanced	JROOT='${JROOT}' all

clean:
	make -C basic       clean
	make -C graphs      clean
	make -C heaps       clean
	make -C searchTrees clean
	make -C advanced    clean
