JROOT = ~/bin/java

CLASSFILES = Prim.class Mst.class MstRep.class

%.class: %.java
	javac -cp ~/bin/java $<
	cp *.class ${JROOT}/algoLib/graphAlgorithms/mst

all : ${CLASSFILES}

clean :
	#make -C unit clean
	rm -f *.class
