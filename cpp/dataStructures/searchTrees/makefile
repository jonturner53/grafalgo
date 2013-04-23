SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
IDIR := ../../include
LDIR := ../../lib
BIN := ~/bin
WARN := -Wall -Wno-c++11-extensions
CXXFLAGS := ${WARN} ${ARCH} -O2

HFILES = ${IDIR}/Adt.h ${IDIR}/stdinc.h ${IDIR}/BstSet.h ${IDIR}/BalBstSet.h \
	${IDIR}/SaBstSet.h ${IDIR}/DkBstSet.h \
	 ${IDIR}/StairFunc.h ${IDIR}/TreeMap.h ${IDIR}/SaTreeMap.h
OFILES = BstSet.o BalBstSet.o SaBstSet.o \
	 TreeMap.o SaTreeMap.o
	 #omit for now: DkBstSet.o StairFunc.o 
${OFILES} : ${HFILES}

.cpp.o:
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all :	${OFILES}
	ar -ru ${LDIR}/lib-ds.a ${OFILES}

clean:
	rm -f *.o
