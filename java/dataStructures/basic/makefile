JROOT = ~/bin/java
CLASSFILES = Partition.class UiList.class UiHashTbl.class HashSet.class \
		UiClist.class UiSetPair.class IdMap.class

%.class: %.java
	javac -cp ~/bin/java $<
	cp *.class ${JROOT}/algoLib/dataStructures/basic

all : ${CLASSFILES}

clean :
	make -C unit clean
	rm -f *.class
