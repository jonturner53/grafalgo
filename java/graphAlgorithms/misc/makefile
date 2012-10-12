JROOT = ~/bin/java

CLASSFILES = rgraph.class cgraph.class

%.class: %.java
	javac -cp ~/bin/java $<
	cp *.class ${JROOT}/algoLib/graphAlgorithms/misc

all : ${CLASSFILES}

clean :
	#make -C unit clean
	rm -f *.class
