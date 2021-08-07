CLASSFILES = List.class List_d.class Dlists.class ListPair.class Dsets.class

${CLASSFILES} : ../Adt.class

%.class: %.java
	javac $<

all : ${CLASSFILES}

clean :
	rm -f *.class
