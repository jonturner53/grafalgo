ALGOLIBROOT = ../..
JAVAROOT = ~/bin/java

CLASSFILES = Graph.class Wgraph.class 

all:	${CLASSFILES}

%.class: %.java
	javac -cp ${JAVAROOT} $<
	cp *.class ${JAVAROOT}/algoLib/dataStructures/graphs

clean:
	rm -f *.o *.class
	#make -C unit clean
