CLASSFILES = Graph.class Graph_w.class

${CLASSFILES} : ../Adt.class

%.class: %.java
	javac $<

all : ${CLASSFILES}

clean :
	rm -f *.class
