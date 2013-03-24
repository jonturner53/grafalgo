SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
IDIR := ../../include
LDIR := ../../lib
BIN := ~/bin
WARN := -Wall -Wno-c++11-extensions
CXXFLAGS := ${WARN} ${ARCH} -O2

HFILES = ${IDIR}/Adt.h ${IDIR}/ClistSet.h ${IDIR}/Dheap.h ${IDIR}/Ddheap.h \
	${IDIR}/LheapSet.h ${IDIR}/LlheapSet.h ${IDIR}/FheapSet.h \
	${IDIR}/LfheapSet.h
OFILES = Dheap.o Ddheap.o DheapSet.o LheapSet.o LlheapSet.o \
	FheapSet.o LfheapSet.o
${OFILES} : ${HFILES}

.cpp.o:
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all :	${OFILES}
	ar -ru ${LDIR}/lib-ds.a ${OFILES}

clean:
	rm -f *.o
