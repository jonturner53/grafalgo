IDIR = ../../include
LDIR = ../../lib
ARCH := $(shell getconf LONG_BIT)
CXXFLAGS_32 = -O2 -m32 -I ${IDIR}
CXXFLAGS_64 = -O2 -m64 -I ${IDIR}
CXXFLAGS = $(CXXFLAGS_$(ARCH)) 
#CXXFLAGS = -Wall -O2 -m64  -I ${IDIR}

LIBFILES = UiList.o UiDlist.o UiListSet.o UiClist.o UiSetPair.o \
	HashMap.o HashSet.o UiHashTbl.o  IdMap.o  Partition.o UiRlist.o

CLASSFILES = UiHashTbl.class UiClist.class UiSetPair.class IdMap.class

.cpp.o : %.cpp %.h ${IDIR}/stdinc.h
	${CXX} ${CXXFLAGS} -c $<

%.class: %.java
	javac -cp ~/bin/java $<
	cp *.class ~/bin/java/algoLib/dataStructures/basic

all : ${LIBFILES} ${CLASSFILES}
	ar -ru ${LDIR}/lib-ds.a ${LIBFILES}

clean :
	make -C unit clean
	rm -f *.o *.class
