JROOT = ~/bin/java

CLASSFILES = Util.class

all : ${CLASSFILES}

%.class: %.java
	javac -cp ${JROOT} $<
	cp *.class ${JROOT}/algoLib/misc

clean :
	rm -f *.class
