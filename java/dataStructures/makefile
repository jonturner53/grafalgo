CLASSFILES = Adt.class

%.class: %.java
	javac $<

all : ${CLASSFILES}
	make -C basic 		all
	make -C graphs		all
	make -C heaps		all
	make -C searchTrees	all
	make -C advanced	all

clean:
	rm -f *.class
	make -C basic       clean
	make -C graphs      clean
	make -C heaps       clean
	make -C searchTrees clean
	make -C advanced    clean
