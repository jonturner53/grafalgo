ALGOLIBROOT = ../..
JAVAROOT = ~/bin/java
IDIR = ${ALGOLIBROOT}/include
LDIR = ${ALGOLIBROOT}/lib
LIB = ${LDIR}/lib-ds.a
ARCH := $(shell getconf LONG_BIT)
CXXFLAGS_32 = -O2 -m32 -I ${IDIR}
CXXFLAGS_64 = -O2 -m64 -I ${IDIR}
CXXFLAGS = $(CXXFLAGS_$(ARCH)) 
#CXXFLAGS = -Wall -O2 -m64 -I ${IDIR}

LIBFILES = Graph.o Wgraph.o Digraph.o Wdigraph.o Flograph.o Wflograph.o \
	Mflograph.o
CLASSFILES = Graph.class Wgraph.class 

.cpp.o:
	${CXX} ${CXXFLAGS} -c $<

Graph.o :     ${IDIR}/stdinc.h ${IDIR}/Graph.h
Wgraph.o :    ${IDIR}/stdinc.h ${IDIR}/Graph.h ${IDIR}/Wgraph.h
Digraph.o :   ${IDIR}/stdinc.h ${IDIR}/Graph.h ${IDIR}/Digraph.h
Wdigraph.o :  ${IDIR}/stdinc.h ${IDIR}/Graph.h ${IDIR}/Digraph.h \
	      ${IDIR}/Wdigraph.h
Flograph.o :  ${IDIR}/stdinc.h ${IDIR}/Graph.h ${IDIR}/Digraph.h \
	      ${IDIR}/Flograph.h
Wflograph.o : ${IDIR}/stdinc.h ${IDIR}/Graph.h ${IDIR}/Digraph.h \
	      ${IDIR}/Flograph.h ${IDIR}/Wflograph.h
Mflograph.o : ${IDIR}/stdinc.h ${IDIR}/Graph.h ${IDIR}/Digraph.h \
	      ${IDIR}/Flograph.h ${IDIR}/Wflograph.h ${IDIR}/Mflograph.h 

all:	${LIBFILES} ${CLASSFILES}
	ar -ru ${LIB} ${LIBFILES}
	#make -C unit IDIR='${IDIR}' LDIR='${LDIR}' BIN='${BIN}' \
	#	    CXXFLAGS='${CXXFLAGS}' all

# %.class: %.java
# 	javac -cp ${JAVAROOT} $<
# 	cp *.class ${JAVAROOT}/algoLib/dataStructures/graphs

Graph.class: Graph.java
	javac -cp ${JAVAROOT} $<
	cp *.class ${JAVAROOT}/algoLib/dataStructures/graphs

Wgraph.class: Wgraph.java
	javac -cp ${JAVAROOT} $<
	cp *.class ${JAVAROOT}/algoLib/dataStructures/graphs

clean:
	rm -f *.o *.class
	#make -C unit clean
