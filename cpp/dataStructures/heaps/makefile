SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
IDIR := ../../include
LDIR := ../../lib
BIN := ~/bin
WARN := -Wall -Wno-c++11-extensions
CXXFLAGS := ${WARN} ${ARCH} -O2

HFILES = ${IDIR}/Adt.h ${IDIR}/ClistSet.h ${IDIR}/Dheap.h ${IDIR}/LheapSet.h \
	${IDIR}/LlheapSet.h ${IDIR}/FheapSet.h 
OFILES = Dheap.o LheapSet.o LlheapSet.o FheapSet.o 
${OFILES} : ${HFILES}

.cpp.o:
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all :	${OFILES}
	ar -ru ${LDIR}/lib-ds.a ${OFILES}

clean:
	rm -f *.o
