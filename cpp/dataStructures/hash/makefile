SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
IDIR := ../../include
LDIR := ../../lib
BIN := ~/bin
WARN := -Wall -Wno-c++11-extensions
CXXFLAGS := ${WARN} ${ARCH} -O2

HFILES = ${IDIR}/Adt.h ${IDIR}/SetPair.h ${IDIR}/HashMap.h ${IDIR}/HashSet.h \
	${IDIR}/HashTbl.h  ${IDIR}/IdMap.h 
OFILES = HashMap.o HashSet.o HashTbl.o  IdMap.o 
${OFILES} : ${HFILES}

.cpp.o : 
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all : ${OFILES}
	ar -ru ${LDIR}/lib-ds.a ${OFILES}

clean :
	make -C unit clean
	rm -f *.o
