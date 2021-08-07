CLASSFILES = Heap_d.class Heap_d_float.class

${CLASSFILES} : ../Adt.class

%.class: %.java
	javac $<

all : ${CLASSFILES}

clean :
	rm -f *.class
