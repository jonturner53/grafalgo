CLASSFILES = testGraph.class testGraph_w.class

${CLASSFILES} : ../../Adt.class

testGraph.class : ../Graph.class
testGraph_w.class : ../Graph_w.class

%.class: %.java
	javac $<

all : ${CLASSFILES}

clean :
	rm -f *.class
