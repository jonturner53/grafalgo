JROOT = ~/bin/java
CLASSFILES =

%.class: %.java
	javac -cp ~/bin/java $<
	cp *.class ${JROOT}/algoLib/dataStructures/advanced

all : ${CLASSFILES}

clean :
	rm -f *.class
