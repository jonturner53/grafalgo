JROOT = ~/bin/java
CLASSFILES =

%.class: %.java
	javac -cp ~/bin/java $<
	cp *.class ${JROOT}/algoLib/dataStructures/searchTrees

all : ${CLASSFILES}

clean :
	make -C unit clean
	rm -f *.class
