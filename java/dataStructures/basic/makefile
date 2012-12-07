JROOT = ~/bin/java
CLASSFILES = Partition.class List.class HashTbl.class HashSet.class \
		Clist.class SetPair.class IdMap.class

%.class: %.java
	javac -cp ~/bin/java $<
	cp *.class ${JROOT}/algoLib/dataStructures/basic

all : ${CLASSFILES}

clean :
	make -C unit clean
	rm -f *.class
