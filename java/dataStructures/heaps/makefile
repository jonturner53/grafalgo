JROOT = ~/bin/java

CLASSFILES = Dheap.class

%.class: %.java
	javac -cp ~/bin/java $<
	cp *.class ${JROOT}/algoLib/dataStructures/heaps

all : ${CLASSFILES}

clean :
	make -C unit clean
	rm -f *.class
