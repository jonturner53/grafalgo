SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
IDIR := ../../include
LDIR := ../../lib
BIN := ~/bin
WARN := -Wall -Wno-c++11-extensions
CXXFLAGS := ${WARN} ${ARCH} -O2

HFILES = ${IDIR}/Adt.h ${IDIR}/Dlists.h \
	${IDIR}/Mheaps_l.h ${IDIR}/Mheaps_ll.h ${IDIR}/Mheaps_f.h 
OFILES = Mheaps_l.o Mheaps_ll.o Mheaps_f.o 
${OFILES} : ${HFILES}

.cpp.o:
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all :	${OFILES}
	ar -ru ${LDIR}/lib-ds.a ${OFILES}

clean:
	rm -f *.o
