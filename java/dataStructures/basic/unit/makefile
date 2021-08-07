ROOT = ../../..
CLASSFILES = testList.class testList_d.class testDlists.class \
	testListPair.class testDsets.class

testList.class : ../List.class
testList_d.class : ../List_d.class
testDlists.class : ../Dlists.class
testListPair.class : ../ListPair.class
testDsets.class : ../Dsets.class

%.class: %.java
	javac $<

all : ${CLASSFILES}

clean :
	rm -f *.class
