SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
IDIR := ../../include
LDIR := ../../lib
BIN := ~/bin
CXXFLAGS := -Wall ${ARCH} -O2 -std=c++0x

HFILES = ${IDIR}/stdinc.h ${IDIR}/Adt.h ${IDIR}/ListPair.h ${IDIR}/Djsets_cl.h \
	 ${IDIR}/Set_h.h ${IDIR}/Graph.h ${IDIR}/Graph_d.h \
	 ${IDIR}/Graph_f.h ${IDIR}/Graph_wf.h ${IDIR}/Graph_ff.h 
OFILES = Graph.o Graph_w.o Graph_d.o Graph_wd.o Graph_f.o Graph_wf.o \
	 Graph_ff.o Graph_g.o Rgraph.o
${OFILES} : ${HFILES}

.cpp.o:
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all:	${OFILES} 
	ar -ru ${LDIR}/lib-ds.a ${OFILES}

clean:
	rm -f *.o
