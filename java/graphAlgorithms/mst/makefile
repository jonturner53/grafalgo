CLASSFILES = Mst.class testMst.class

testMst.class: Mst.class

%.class: %.java
	javac $<

all : ${CLASSFILES}

clean :
	rm -f *.class
